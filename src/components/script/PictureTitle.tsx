// A page's name with its picture beside it (second design pass, Desktop Screens "Me": the blob beside "You, so far"), for hub and list pages without a reference of their own

// Load the type for content passed in
import type { ReactNode } from "react";

// What the title takes
interface PictureTitleProps {
  // The picture on the left: the blob, Sage or a mode tile
  picture: ReactNode;
  // The page's name
  title: string;
  // One short line under it
  children?: ReactNode;
  // Something on the right, such as a button
  aside?: ReactNode;
}

// The picture, the name and its line in one row
export function PictureTitle({ picture, title, children, aside }: PictureTitleProps) {
  // One row: the picture, the words, then anything on the right
  return (
    <div className="mt-4 flex items-center gap-4 md:mt-6 md:gap-4.5">
      {/* The picture */}
      <span aria-hidden="true" className="flex flex-none">{picture}</span>
      {/* The words */}
      <div className="min-w-0 flex-1">
        {/* The page's name */}
        <h1 className="font-display text-statement leading-none font-semibold motion-safe:animate-rise">{title}</h1>
        {/* One short line on what is here */}
        {children && <p className="mt-1.5 max-w-[56ch] font-bold text-ink-muted">{children}</p>}
      </div>
      {/* Anything on the right */}
      {aside}
    </div>
  );
}
