# Deploy Runbook — VisOpus zitadel-login fork

This is the operator runbook for shipping changes to `auth.test.visopus.com`.

GCP project: **opus-test-69** · Region: **europe-west2** · Service: **zitadel-login** · Image repo: `europe-west2-docker.pkg.dev/opus-test-69/zitadel-images/zitadel-login`

---

## Image tag scheme

Every successful build pushes three tags to the same image digest:

| Tag | Stability | Purpose |
|---|---|---|
| `visopus-<BUILD_ID>` | immutable | rollback reference, audit trail (Cloud Build assigns a unique BUILD_ID per run) |
| `visopus-v<VERSION>` | immutable per version | human-readable rollback ref. Read from `./VERSION` at build time |
| `visopus` | floating | "latest VisOpus build". Convenient for ad-hoc redeploys; do NOT use for rollback |

Cloud Run revisions are also tagged `v<MAJOR>-<MINOR>-<PATCH>-<8-char-build-id>` (lowercase + hyphens — Cloud Run revision-tag rules forbid dots), giving each revision a discoverable URL like `https://v0-1-0-abc12345---zitadel-login-<hash>-ew.a.run.app/`.

## Bumping the version

`VERSION` (a single line, semver, no `v` prefix) lives at the repo root.

| Change | Bump |
|---|---|
| Tweaks, build/CI fixes, dependency bumps that don't change behaviour | patch (`0.1.0` → `0.1.1`) |
| Visual rebrand, new locale, copy revisions, new env vars, new login screen flows | minor (`0.1.0` → `0.2.0`) |
| Auth-flow break (e.g. MFA mechanism changes), incompatible config schema, image base swap | major (`0.1.0` → `1.0.0`) |

```bash
echo 0.2.0 > VERSION
git add VERSION
git commit -m "chore(release): bump to 0.2.0 — VisOpus visual rebrand"
git push
```

The push triggers Cloud Build (see "Automatic deploys" below).

## One-time setup — Cloud Build GitHub trigger

The trigger config lives at `.cloudbuild/trigger-visopus-customizations.yaml`.

```bash
# 1. Connect the repo to Cloud Build (manual, one-time, GitHub App OAuth).
#    Console → Cloud Build → Triggers → "Connect Repository" → GitHub
#    Select: WILLGVisOpus/typescript

# 2. Import the trigger config.
gcloud builds triggers import \
  --source=.cloudbuild/trigger-visopus-customizations.yaml \
  --project=opus-test-69

# 3. Verify it landed.
gcloud builds triggers describe visopus-login-customizations \
  --project=opus-test-69
```

Required IAM on the Cloud Build service account (`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com` by default):

- `roles/cloudbuild.builds.builder`
- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.writer`

## Automatic deploys (the happy path)

```
git push → Cloud Build trigger fires → builds image → pushes 3 tags →
  → creates new Cloud Run revision (--no-traffic) → routes 10% canary traffic to it.
```

After the build completes, the revision is **live but only serving 10% of users**. Smoke-test:

```bash
# Find the canary URL (revision tag starts with 'v<version>-<build-prefix>'):
gcloud run services describe zitadel-login \
  --region=europe-west2 --project=opus-test-69 \
  --format='value(status.traffic)'

# Hit the tagged URL directly to bypass the 10/90 split:
curl -sI https://v0-1-0-abc12345---zitadel-login-<hash>-ew.a.run.app/
```

## Promote canary to 100%

After smoke testing passes:

```bash
gcloud run services update-traffic zitadel-login \
  --region=europe-west2 \
  --to-latest \
  --project=opus-test-69
```

## Roll back

To roll back to a previous version (for example, `visopus-v0.1.0`):

```bash
gcloud run services update zitadel-login \
  --image=europe-west2-docker.pkg.dev/opus-test-69/zitadel-images/zitadel-login:visopus-v0.1.0 \
  --region=europe-west2 \
  --project=opus-test-69
```

To roll back to a specific BUILD_ID (when you don't have a clean version tag):

```bash
gcloud run services update zitadel-login \
  --image=europe-west2-docker.pkg.dev/opus-test-69/zitadel-images/zitadel-login:visopus-<BUILD_ID> \
  --region=europe-west2 \
  --project=opus-test-69
```

To find recent BUILD_IDs:

```bash
gcloud builds list --project=opus-test-69 \
  --filter='status=SUCCESS AND substitutions.TRIGGER_NAME=visopus-login-customizations' \
  --limit=10 --format='table(id,createTime,substitutions.SHORT_SHA)'
```

## Manual fallback (no trigger, no GitHub push)

```bash
gcloud builds submit \
  --config=cloudbuild.visopus.yaml \
  --project=opus-test-69 \
  .
```

This still produces all three image tags, still creates a no-traffic revision with the 10% canary split. The only difference is `BUILD_ID` is generated locally and the trigger metadata isn't attached.

## Pause the trigger (e.g., during an incident)

```bash
gcloud builds triggers update visopus-login-customizations \
  --project=opus-test-69 \
  --enable=false   # or --enable=true to resume
```
