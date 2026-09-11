import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from './api';

describe('getFriendlyErrorMessage', () => {
  it('traduz erros de rede para uma mensagem em portugues', () => {
    expect(getFriendlyErrorMessage(new Error('Failed to fetch'))).toBe(
      'Não foi possível ligar ao servidor. Verifique a sua ligação à internet e tente novamente.'
    );
  });

  it('devolve a mensagem original do backend quando nao e um erro de rede', () => {
    expect(getFriendlyErrorMessage(new Error('Credenciais inválidas'))).toBe('Credenciais inválidas');
  });

  it('usa a mensagem de fallback para valores que nao sao Error', () => {
    expect(getFriendlyErrorMessage('string qualquer', 'fallback')).toBe('fallback');
  });
});
