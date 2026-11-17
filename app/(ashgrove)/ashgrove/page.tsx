import { Clock0317 } from '@/components/illustrations/Clock0317';
import { HallElevation } from '@/components/illustrations/HallElevation';
import { Lantern } from '@/components/illustrations/Lantern';
import { Door } from '@/components/threshold/Door';
import { HeroActions } from '@/components/threshold/HeroActions';
import { BlendImage } from '@/components/ui/BlendImage';
import { DoubleRule } from '@/components/ui/DoubleRule';
import { Frame } from '@/components/ui/Frame';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { publicImages } from '@/lib/public-images.generated';

// The Threshold. Everything on this page is public: it is the cover of the
// file, and the only puzzle on it is meant to be read by anyone who arrives.

const RULES = [
  {
    numeral: 'I',
    head: 'Seven rooms',
    body: 'Each one is sealed. They open in order. You do not choose the order.',
  },
  {
    numeral: 'II',
    head: 'One code each',
    body: 'Every room gives up exactly one code. It is in the evidence, not in the legend.',
  },
  {
    numeral: 'III',
    head: 'Three hints per room',
    body: 'They cost time: five minutes, then ten, then twenty. The file keeps the total.',
  },
  {
    numeral: 'IV',
    head: 'Three accusations',
    body: 'When the rooms are done you name the killer. You may be wrong twice.',
  },
  {
    numeral: 'V',
    head: 'One rank',
    body: 'Every detective who closes the case is ranked, from Constable to Warden-Breaker.',
  },
] as const;

// The recruitment letter. Five lines, exactly as typed.
const LETTER = [
  'Every death in Ashgrove was signed off the same way.',
  'Nine names since 1871, and one legend to carry them all.',
  'The last file was sealed before anyone finished reading it.',
  'Evidence does not expire. It waits for someone who can read.',
  'Read this letter again before you answer. Most do not.',
] as const;

export default function ThresholdPage() {
  const hall = publicImages['hero-hall'];
  const warden = publicImages['ember-warden'];
  const clock = publicImages['clock-0317'];

  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section aria-labelledby="file-title" className="relative">
        <Reveal className="mx-auto w-full max-w-[1760px]">
          <BlendImage
            variant="scene"
            {...hall}
            alt="The Hall, seen across the marsh at night. Fog lies low on the reeds. One small window at the top of the narrow tower is lit orange. The rest of the house is black."
            ellipse={false}
            fade={{ bottom: 35, left: 12, right: 12 }}
            aspect="21 / 9"
            aspectNarrow="4 / 3"
            focus="60% 42%"
            sizes="(min-width: 1760px) 1760px, 100vw"
            priority
          />
        </Reveal>

        <div className="measure relative -mt-[12vw] pb-16 sm:-mt-[9vw] md:pb-24 2xl:-mt-40">
          <Reveal>
            <h1 id="file-title" className="title title--display">
              The <span className="ember">Ashgrove</span> File
            </h1>
          </Reveal>

          <div className="mt-8 grid gap-x-12 gap-y-8 md:mt-12 md:grid-cols-12">
            <Reveal className="md:col-span-7">
              <p className="title title--lead text-paper">
                In 1949, Ashgrove blamed a legend for a murder. The file was sealed. You have just opened it.
              </p>
            </Reveal>
            <Reveal className="md:col-span-5 md:pt-2">
              <p className="text-paper">Seven rooms. One verdict. Most detectives close this tab at Room III.</p>
              <div className="mt-6">
                <HeroActions />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- legend -- */}
      <Section id="legend" labelledBy="legend-title" className="py-16 md:py-24">
        <Reveal>
          <DoubleRule index="01" id="legend-title" title="The Legend" note="Ashgrove, since 1871" />
        </Reveal>

        <div className="mt-10 grid items-start gap-x-12 gap-y-12 md:mt-14 md:grid-cols-12">
          <Reveal className="mx-auto w-full max-w-[420px] md:col-span-5">
            <BlendImage
              variant="scene"
              {...warden}
              alt="A cloaked figure, far off on a marsh boardwalk at night, carrying an old lantern. Fog. The figure is almost a silhouette. The lantern flame is the only light."
              fade={{ top: 6, bottom: 18 }}
              aspect="3 / 4"
              focus="50% 62%"
              sizes="(min-width: 768px) 420px, 90vw"
              annotation={{ label: 'Exhibit 02 — The Ember Warden', x: 58, y: 47, side: 'left', drop: 20, run: 28 }}
            />
          </Reveal>

          <div className="md:col-span-7">
            <Reveal>
              <Frame label="As Ashgrove tells it" className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
                <p className="title title--lead">They call the one who carries it the Ember Warden.</p>
                <div className="copy mt-6 text-paper">
                  <p>
                    The whole legend is one sentence. Whoever sees the orange light on the marsh from their window is dead
                    by <span className="ember">03:17</span>.
                  </p>
                  <p>
                    Ashgrove has kept count. Nine deaths since 1871. Nine windows that faced the marsh. Nobody there calls
                    it a superstition. They call it the reason to keep the curtains shut.
                  </p>
                  <p>You are not here to add to the count. A legend cannot hold a weapon. Someone in Ashgrove can.</p>
                </div>
              </Frame>
            </Reveal>

            <Reveal className="flex items-end gap-6 md:gap-10">
              <div className="ml-4 w-24 flex-none md:ml-10 md:w-36">
                <Lantern title="Line drawing of a storm lantern hanging from a hook, its flame lit." />
              </div>
              <dl className="mono grid flex-1 grid-cols-3 border-l border-t border-line">
                {[
                  ['Deaths', '09'],
                  ['Since', '1871'],
                  ['The hour', '03:17'],
                ].map(([term, value]) => (
                  <div key={term} className="border-b border-r border-line bg-void px-3 py-4 md:px-5">
                    <dt className="muted">{term}</dt>
                    <dd className="title mt-2 text-2xl text-paper md:text-4xl">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------- victim -- */}
      <Section id="victim" labelledBy="victim-title" className="py-16 md:py-24">
        <Reveal>
          <DoubleRule index="02" id="victim-title" title="The Victim" note="14 November 1949" />
        </Reveal>

        <div className="mt-10 grid items-center gap-x-12 gap-y-14 md:mt-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <Reveal>
              <Frame label="Subject of the file" className="px-6 pb-8 pt-10 md:px-10 md:pb-10 md:pt-12">
                <p className="title title--lead">Professor Elias Varn.</p>
                <div className="copy mt-6 text-paper">
                  <p>
                    Found on 14 November 1949 in the locked <span className="ember">tower study</span>. The mantel{' '}
                    <span className="ember">clock</span> had stopped at 03:17. An <span className="ember">oil lamp</span>{' '}
                    was still burning orange in the window, facing the marsh.
                  </p>
                  <p>
                    Ashgrove read those three things as a signature and closed the door. You will read them as evidence.
                    One of them is lying to you.
                  </p>
                </div>
              </Frame>
            </Reveal>

            <Reveal className="mt-8">
              <dl className="mono grid grid-cols-2 border-l border-t border-line sm:grid-cols-4">
                {[
                  ['Found', '14.XI.1949'],
                  ['Room', 'Tower study'],
                  ['Door', 'Locked'],
                  ['Clock', '03:17'],
                ].map(([term, value]) => (
                  <div key={term} className="border-b border-r border-line bg-void px-3 py-3 md:px-4">
                    <dt className="muted">{term}</dt>
                    <dd className="mt-1 text-paper">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          {/* The drawing and the photograph of the same clock, overlapping. */}
          <Reveal className="relative mx-auto w-full max-w-[460px] md:col-span-5">
            <div className="ml-auto w-[82%]">
              <Clock0317 title="Line drawing of a clock face with both hands just past the three, reading 03:17." />
            </div>
            <div className="relative -mt-[46%] w-[66%]">
              <BlendImage
                variant="cutout"
                {...clock}
                alt="An old brass mantel clock, dust on its glass, lit from one side. It has stopped with both hands just past the three: 03:17."
                sizes="(min-width: 768px) 300px, 60vw"
                annotation={{ label: 'Exhibit 04 — The clock, 03:17', x: 70, y: 53, side: 'left', drop: 24, run: 32 }}
              />
            </div>
          </Reveal>
        </div>

        <Reveal as="figure" className="mx-auto mt-20 max-w-[920px] md:mt-28">
          <HallElevation title="Front elevation of the Hall: a Victorian manor with one narrow tower. A single window at the top of the tower is lit." />
          <figcaption className="mono muted mt-5 text-center">
            Fig. 0 — The Hall, front elevation. The study is the lit window.
          </figcaption>
        </Reveal>
      </Section>

      {/* --------------------------------------------------------- rules -- */}
      <Section id="rules" labelledBy="rules-title" className="py-16 md:py-24">
        <Reveal>
          <DoubleRule index="03" id="rules-title" title="The Rules of Entry" note="Read once. They do not change." />
        </Reveal>

        <Reveal className="mt-10 md:mt-14">
          <Frame as="ol" className="grid md:grid-cols-5">
            {RULES.map((rule, index) => (
              <li
                key={rule.numeral}
                className={`px-6 py-7 ${index > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''}`}
              >
                <span className="title block text-4xl text-muted" aria-hidden="true">
                  {rule.numeral}
                </span>
                <h3 className="mono mono--lg mt-5 text-paper">{rule.head}</h3>
                <p className="mt-3 text-paper">{rule.body}</p>
              </li>
            ))}
          </Frame>
        </Reveal>

      </Section>

      {/* -------------------------------------------------------- letter -- */}
      <Section id="letter" labelledBy="letter-title" className="py-16 md:py-24">
        <Reveal>
          <DoubleRule index="04" id="letter-title" title="The Letter" note="Found at the front of the file" />
        </Reveal>

        <div className="mx-auto mt-10 max-w-[820px] md:mt-14">
          <Reveal>
            <Frame tone="panel" label="Recruitment notice" mark="Ref. 001/49" className="px-6 pb-8 pt-10 md:px-12 md:pb-12 md:pt-14">
              <div className="document flex flex-col gap-4 text-paper" data-testid="letter">
                {LETTER.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p className="mono muted mt-10 text-right">Unsigned. Undated.</p>
            </Frame>
          </Reveal>

          <Reveal className="mt-10">
            <Frame active label="The door" className="px-6 pb-7 pt-10 md:px-12 md:pb-9 md:pt-12">
              <Door />
            </Frame>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
