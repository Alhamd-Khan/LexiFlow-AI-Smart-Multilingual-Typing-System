import logoUrl from '../../Gemini_Generated_Image_v024p9v024p9v024-removebg-preview (1).png';

type MainLogoProps = {
  className?: string;
  alt?: string;
};

export default function MainLogo({ className = 'h-16 w-auto object-contain', alt = 'LexiFlow AI' }: MainLogoProps) {
  return <img src={logoUrl} alt={alt} className={className} />;
}
