import { User } from "lucide-react";
import { C } from "@/lib/tokens";

export function WorkerAvatar({ photo, size = 40 }: { photo?: string | null; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: C.bgAlt }}
    >
      {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : <User size={size * 0.45} color={C.greenMid} />}
    </div>
  );
}
