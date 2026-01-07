// React 19: no default import required

interface Props {
  mode: 'idle' | 'talking';
}

export default function DostMascot({ mode }: Props) {
  const basePath = import.meta.env.BASE_URL || '/';
  const imageSrc = mode === 'talking' ? `${basePath}dost/talking.gif` : `${basePath}dost/idle.png`;

  return (
      <div className="absolute bottom-4 right-4 w-28 h-28">
        <img src={imageSrc} alt="DOST maskotu" className="w-full h-full object-contain" />
      </div>
  );
}
