'use client';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-[60vh] bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center text-center animate-fade-in">
      <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">{title}</h1>
      <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">{description}</p>
      <p className="text-lg text-gray-400 font-medium">This section is currently under meticulous development to ensure a flawless experience.</p>
    </div>
  );
}