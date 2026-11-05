<?php

namespace App\Console\Commands;

use App\Models\PlatformAuditLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateSuperAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'platform:create-super-admin
                            {--email= : The email address for the super administrator}
                            {--name= : The full name for the super administrator}
                            {--password= : The secure password (min 8 chars)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Provision or elevate a user account to Platform Super Administrator';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('=====================================================');
        $this->info('  InstitutoPropio — Platform Super Admin Provisioning');
        $this->info('=====================================================');

        $email = $this->option('email') ?: $this->ask('Enter Super Admin Email:');
        $email = strtolower(trim((string) $email));

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        if ($validator->fails()) {
            $this->error('Invalid email address provided: ' . $validator->errors()->first('email'));
            return Command::FAILURE;
        }

        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            $this->warn("A user account with email [{$email}] already exists.");
            if ($this->input->isInteractive() && ! $this->confirm('Do you want to elevate this user to Platform Super Admin?', true)) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }

            $name = $existingUser->name;
        } else {
            $name = $this->option('name') ?: $this->ask('Enter Full Name:', 'Platform Administrator');
        }

        $password = $this->option('password');
        $shouldUpdatePassword = ! empty($password);

        if ($existingUser && empty($password)) {
            // Prompt only if interactive and explicitly requested; otherwise preserve existing password
            if ($this->input->isInteractive() && $this->confirm('Do you want to update the password for this existing user?', false)) {
                $password = $this->secret('Enter New Super Admin Password:');
                $passwordConfirm = $this->secret('Confirm Password:');

                if ($password !== $passwordConfirm) {
                    $this->error('Passwords do not match. Aborting.');
                    return Command::FAILURE;
                }
                $shouldUpdatePassword = true;
            }
        } elseif (! $existingUser && empty($password)) {
            $password = $this->secret('Enter New Super Admin Password:');
            $passwordConfirm = $this->secret('Confirm Password:');

            if ($password !== $passwordConfirm) {
                $this->error('Passwords do not match. Aborting.');
                return Command::FAILURE;
            }
            $shouldUpdatePassword = true;
        }

        if ($shouldUpdatePassword && strlen((string) $password) < 8) {
            $this->error('Password must be at least 8 characters long.');
            return Command::FAILURE;
        }

        if ($existingUser) {
            $updateData = [
                'role' => 'super_admin',
                'status' => 'active',
                'email_verified_at' => $existingUser->email_verified_at ?? now(),
            ];

            if ($shouldUpdatePassword) {
                $updateData['password'] = Hash::make($password);
            }

            $existingUser->update($updateData);

            $user = $existingUser;
            $this->info("✓ User [{$email}] has been successfully elevated to Platform Super Admin!");
            if (! $shouldUpdatePassword) {
                $this->line("  → Existing account password was preserved unchanged.");
            }
        } else {
            if (! $shouldUpdatePassword) {
                $this->error('Password is required when creating a new user account.');
                return Command::FAILURE;
            }

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'role' => 'super_admin',
                'status' => 'active',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            $this->info("✓ New Super Admin account [{$email}] successfully created!");
        }

        PlatformAuditLog::record(
            action: 'super_admin.provisioned_via_cli',
            target: $user,
            details: ['email' => $email, 'name' => $name],
            user: $user
        );

        $this->newLine();
        $this->line("Super Admin Portal URL: " . url('/platform-admin/login'));
        $this->line("Email:                  {$email}");
        $this->newLine();

        return Command::SUCCESS;
    }
}

