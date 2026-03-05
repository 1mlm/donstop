import {
  CursorRectangleSelection01Icon,
  Touch04Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/cpns/Icon";
import { RightClickMenu } from "@/cpns/RightClickMenu";

export default function Page() {
  return (
    <RightClickMenu>
      <div className="h-screen w-full flex items-center justify-center text-muted-foreground text-lg *:items-center *:gap-3">
        {/* Desktop */}
        <div className="hidden md:flex">
          <Icon icon={CursorRectangleSelection01Icon} size={20} />
          <p>Right-Click to create your first task.</p>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden">
          <Icon icon={Touch04Icon} size={20} />
          <p>Press to create your first task.</p>
        </div>
      </div>
    </RightClickMenu>
  );
}
