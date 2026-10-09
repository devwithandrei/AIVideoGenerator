import { Composition } from 'remotion';
import { NewspaperSpinComposition } from './NewspaperSpinComposition';
import { NewspaperSearchComposition } from './NewspaperSearchComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NewspaperSpin"
        component={NewspaperSpinComposition as React.FC<any>}
        durationInFrames={300}
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
        component={NewspaperSearchComposition as React.FC<any>}
        durationInFrames={480}
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
