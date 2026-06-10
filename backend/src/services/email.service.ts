import { config } from '../config/env.js';

/**
 * Отправка писем через Resend (https://resend.com) обычным HTTP-запросом —
 * без npm-зависимостей. Если RESEND_API_KEY не задан, письмо не уходит,
 * а его содержимое печатается в консоль (удобно для локальной разработки).
 */
export const emailService = {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Сброс пароля — Рейтинг аудиторских организаций';
    const html = buildResetHtml(resetUrl);

    if (!config.resendApiKey) {
      console.log(
        `\n[email] RESEND_API_KEY не задан — письмо не отправлено.\n` +
        `        Кому: ${to}\n` +
        `        Ссылка для сброса пароля: ${resetUrl}\n`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: config.mailFrom, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // Не пробрасываем наружу: пользователю всё равно отвечаем нейтрально,
      // но логируем, чтобы видеть проблемы с доставкой.
      console.error(`[email] Resend ответил ${res.status}: ${detail}`);
    }
  },
};

function buildResetHtml(resetUrl: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #2c2820;">
    <h2 style="color: #1a1e2e;">Сброс пароля</h2>
    <p>Вы запросили сброс пароля в системе «Рейтинг аудиторских организаций».</p>
    <p>Нажмите на кнопку ниже, чтобы задать новый пароль. Ссылка действует ${config.resetTokenTtlMinutes} минут.</p>
    <p style="margin: 24px 0;">
      <a href="${resetUrl}" style="background: #1a1e2e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">
        Задать новый пароль
      </a>
    </p>
    <p style="font-size: 13px; color: #9a8a70;">
      Если кнопка не работает, скопируйте ссылку в браузер:<br>
      <a href="${resetUrl}">${resetUrl}</a>
    </p>
    <p style="font-size: 13px; color: #9a8a70;">
      Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
    </p>
  </div>`;
}
