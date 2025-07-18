// components/FlexBox.tsx

import { ReactNode } from "react";

interface NarrowColProps {
  children: ReactNode;
}

export const NarrowCol = ({ children }: NarrowColProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <div className="h-96 fixed top-0 w-full bg-gradient-to-br from-lime-500/0 to-lime-500/10 -rotate-1 scale-125"></div>
      <div className="w-full max-w-lg space-y-3 relative">{children}</div>
    </div>
  );
};
