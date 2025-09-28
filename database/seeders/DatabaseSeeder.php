<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Investment;
use App\Models\Expense;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create sample investments
        Investment::create([
            'name' => 'Tech Startup A',
            'type' => 'Equity',
            'amount' => 50000.00,
            'current_value' => 55000.00,
            'purchase_date' => '2024-01-15',
            'status' => 'active',
            'notes' => 'Promising AI startup with strong team'
        ]);

        Investment::create([
            'name' => 'Real Estate Fund',
            'type' => 'Real Estate',
            'amount' => 75000.00,
            'current_value' => 81000.00,
            'purchase_date' => '2024-02-20',
            'status' => 'active',
            'notes' => 'Commercial real estate investment fund'
        ]);

        Investment::create([
            'name' => 'Green Energy Co',
            'type' => 'Bonds',
            'amount' => 30000.00,
            'current_value' => 31950.00,
            'purchase_date' => '2024-03-10',
            'status' => 'active',
            'notes' => 'Renewable energy infrastructure bonds'
        ]);

        // Create sample expenses
        Expense::create([
            'category' => 'Office Rent',
            'amount' => 2500.00,
            'date' => '2024-01-01',
            'description' => 'Monthly office rent payment',
            'payment_method' => 'Bank Transfer'
        ]);

        Expense::create([
            'category' => 'Marketing',
            'amount' => 1200.00,
            'date' => '2024-01-05',
            'description' => 'Digital advertising campaign',
            'payment_method' => 'Credit Card'
        ]);

        Expense::create([
            'category' => 'Utilities',
            'amount' => 350.00,
            'date' => '2024-01-08',
            'description' => 'Electricity and internet bills',
            'payment_method' => 'Debit Card'
        ]);

        // Create sample accounts
        Account::create([
            'name' => 'Main Checking',
            'type' => 'Checking',
            'bank_name' => 'Chase Bank',
            'account_number' => '****1234',
            'balance' => 45000.00,
            'is_active' => true
        ]);

        Account::create([
            'name' => 'Savings Account',
            'type' => 'Savings',
            'bank_name' => 'Wells Fargo',
            'account_number' => '****5678',
            'balance' => 125000.00,
            'is_active' => true
        ]);

        Account::create([
            'name' => 'Investment Account',
            'type' => 'Investment',
            'bank_name' => 'Fidelity',
            'account_number' => '****9012',
            'balance' => 85000.00,
            'is_active' => true
        ]);

        // Get account IDs for transactions
        $checkingAccount = Account::where('name', 'Main Checking')->first();
        $savingsAccount = Account::where('name', 'Savings Account')->first();
        $investmentAccount = Account::where('name', 'Investment Account')->first();

        // Create sample transactions
        Transaction::create([
            'account_id' => $checkingAccount->id,
            'type' => 'income',
            'amount' => 5000.00,
            'description' => 'Client payment received',
            'date' => '2024-01-15',
            'category' => 'Revenue',
            'reference_number' => 'REF001'
        ]);

        Transaction::create([
            'account_id' => $savingsAccount->id,
            'type' => 'expense',
            'amount' => 2500.00,
            'description' => 'Office rent payment',
            'date' => '2024-01-01',
            'category' => 'Expense',
            'reference_number' => 'REF002'
        ]);

        Transaction::create([
            'account_id' => $checkingAccount->id,
            'type' => 'income',
            'amount' => 3200.00,
            'description' => 'Investment return payment',
            'date' => '2024-01-20',
            'category' => 'Investment',
            'reference_number' => 'REF003'
        ]);

        Transaction::create([
            'account_id' => $investmentAccount->id,
            'type' => 'expense',
            'amount' => 50000.00,
            'description' => 'Investment in Tech Startup A',
            'date' => '2024-01-15',
            'category' => 'Investment',
            'reference_number' => 'REF004'
        ]);

        Transaction::create([
            'account_id' => $savingsAccount->id,
            'type' => 'income',
            'amount' => 1500.00,
            'description' => 'Interest payment',
            'date' => '2024-01-31',
            'category' => 'Interest',
            'reference_number' => 'REF005'
        ]);
    }
}
