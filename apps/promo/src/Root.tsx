import React from 'react';
import { Composition, Series } from 'remotion';
import { FPS, WIDTH, HEIGHT, SCENE_DURATIONS, TOTAL_FRAMES } from './constants';
import { SceneIntro }    from './scenes/SceneIntro';
import { SceneTriage }   from './scenes/SceneTriage';
import { SceneCrisis }   from './scenes/SceneCrisis';
import { SceneLocation } from './scenes/SceneLocation';
import { SceneAI }       from './scenes/SceneAI';
import { SceneCTA }      from './scenes/SceneCTA';

const PromoVideo: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.intro}>
      <SceneIntro />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.triage}>
      <SceneTriage />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.crisis}>
      <SceneCrisis />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.location}>
      <SceneLocation />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.ai}>
      <SceneAI />
    </Series.Sequence>
    <Series.Sequence durationInFrames={SCENE_DURATIONS.cta}>
      <SceneCTA />
    </Series.Sequence>
  </Series>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PromoVideo"
    component={PromoVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
