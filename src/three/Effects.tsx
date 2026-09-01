import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Effects() {
  return (
    <EffectComposer>
      <Bloom intensity={0.9} luminanceThreshold={0.45} luminanceSmoothing={0.9} mipmapBlur />
    </EffectComposer>
  );
}

export default Effects;
