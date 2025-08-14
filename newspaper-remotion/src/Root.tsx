import { Composition } from '@remotion/renderer';
import { NewspaperSpinComposition } from './NewspaperSpinComposition';
import { NewspaperSearchComposition } from './NewspaperSearchComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NewspaperSpin"
        component={NewspaperSpinComposition}
        durationInFrames={300} // 5 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          name: "Sample Text",
          theme: "light",
          aspect: "landscape",
          duration: "5s"
        }}
      />
      <Composition
        id="NewspaperSearch"
        component={NewspaperSearchComposition}
        durationInFrames={480} // 8 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          name: "Sample Text",
          theme: "light",
          aspect: "landscape",
          duration: "auto",
          newspaperImage: null
        }}
      />
    </>
  );
};
