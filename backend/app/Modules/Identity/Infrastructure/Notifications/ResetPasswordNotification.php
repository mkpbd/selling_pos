<?php

declare(strict_types=1);

namespace App\Modules\Identity\Infrastructure\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Password reset email pointing to the SPA reset page.
 */
final class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(#[\SensitiveParameter] public readonly string $token) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        $minutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject('Reset your '.config('app.name').' password')
            ->line('We received a request to reset the password for your account.')
            ->action('Reset password', $url)
            ->line("This link expires in {$minutes} minutes.")
            ->line('If you did not request a reset, no action is needed.');
    }
}
