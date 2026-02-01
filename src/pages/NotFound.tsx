import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="text-9xl font-bold text-primary mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-6">
          Desculpe, a página que você está tentando acessar não existe ou foi movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    </div>
  );
}
