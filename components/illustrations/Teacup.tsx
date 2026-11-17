import { Illustration } from '@/components/illustrations/Illustration';

/** A teacup on its side, the tea run out across the desk. */
export function Teacup({ className, title }: { className?: string; title?: string }) {
  return (
    <Illustration viewBox="0 0 360 200" className={className} title={title}>
      {/* the desk, and the cup's own axis */}
      <path className="faint dashed" d="M0 172H360" />
      <path className="faint dashed" d="M126 112H274" />

      {/* saucer */}
      <ellipse cx="92" cy="160" rx="78" ry="11" />
      <ellipse className="faint" cx="92" cy="159" rx="44" ry="6" />

      {/* cup: rim, bowl, foot */}
      <ellipse cx="232" cy="112" rx="20" ry="48" />
      <ellipse className="faint" cx="232" cy="112" rx="14" ry="40" />
      <path d="M232 64C196 60 162 72 152 96" />
      <path d="M232 160C196 164 162 152 152 128" />
      <ellipse cx="150" cy="112" rx="7" ry="17" />

      {/* handle */}
      <path d="M184 67C176 30 224 26 214 63" />
      <path className="faint" d="M192 66C188 44 212 42 207 63" />

      {/* the spill */}
      <path d="M236 158C262 150 300 152 326 162C348 170 338 184 306 184C268 188 228 186 214 176C206 170 220 162 236 158Z" />
      <path className="faint" d="M246 168H300M258 176H318" />
    </Illustration>
  );
}
