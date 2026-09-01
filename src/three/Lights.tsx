function Lights() {
  return (
    <>
      <ambientLight intensity={1.5} />

      <directionalLight position={[8, 10, 5]} intensity={2} castShadow />

      <pointLight position={[0, 5, 0]} intensity={25} color="#8b5cf6" />
    </>
  );
}

export default Lights;
