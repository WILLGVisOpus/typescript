type Props = {
  darkSrc?: string;
  lightSrc?: string;
  height?: number;
  width?: number;
};

// Renders the BrandingSettings logo when provided (admin UI override),
// otherwise the VisOpus icon + wordmark stacked.
export function Logo({ lightSrc, darkSrc, height = 64, width = 64 }: Props) {
  if (lightSrc || darkSrc) {
    return (
      <>
        {darkSrc && (
          <div className="hidden dark:flex">
            <img height={height} width={width} src={darkSrc} alt="logo" />
          </div>
        )}
        {lightSrc && (
          <div className="flex dark:hidden">
            <img height={height} width={width} src={lightSrc} alt="logo" />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src="/icon.svg"
        alt="VisOpus"
        width={Math.min(height, 64)}
        height={Math.min(height, 64)}
        className="h-16 w-16"
      />
      <span className="text-2xl font-bold tracking-tight text-text-light-500 dark:text-text-dark-500">
        VisOpus
      </span>
    </div>
  );
}
