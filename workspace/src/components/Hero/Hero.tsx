interface HeroProps {
  title: string;
  description: string;
}

export const Hero = ({ title, description }: HeroProps) => {
  return (
    <div className="bg-gray-100 py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-gray-600">{description}</p>
      </div>
    </div>
  );
};