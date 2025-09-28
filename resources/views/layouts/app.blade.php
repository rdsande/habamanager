<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'SMM - Smart Money Manager')</title>
    
    <!-- CSS -->
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- API Service -->
    <script src="{{ asset('js/api-service.js') }}"></script>
    
    @stack('styles')
</head>
<body>
    <div class="container">
        <!-- Sidebar -->
        <nav class="sidebar">
            <div class="logo">
                <div class="logo-icon"><i class="fas fa-chart-line"></i></div>
                <div class="logo-text">SMM</div>
            </div>
            <div class="sidebar-nav">
                <a href="{{ route('dashboard') }}" class="nav-item {{ request()->routeIs('dashboard') ? 'active' : '' }}"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                <a href="{{ route('investments.index') }}" class="nav-item {{ request()->routeIs('investments.*') ? 'active' : '' }}"><i class="fas fa-chart-pie"></i> Investments</a>
                <a href="{{ route('expenses.index') }}" class="nav-item {{ request()->routeIs('expenses.*') ? 'active' : '' }}"><i class="fas fa-receipt"></i> Expenses</a>
                <a href="{{ route('accounts.index') }}" class="nav-item {{ request()->routeIs('accounts.*') ? 'active' : '' }}"><i class="fas fa-university"></i> Bank Accounts</a>
                <a href="{{ route('transactions.index') }}" class="nav-item {{ request()->routeIs('transactions.*') ? 'active' : '' }}"><i class="fas fa-exchange-alt"></i> Transactions</a>
                <a href="{{ route('audit.index') }}" class="nav-item {{ request()->routeIs('audit.*') ? 'active' : '' }}"><i class="fas fa-history"></i> Audit Logs</a>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="main-content">
            <div class="content-header">
                <h1>@yield('page-title', 'Dashboard')</h1>
                <div class="header-actions">
                    @yield('header-actions')
                </div>
            </div>
            
            <div class="content-body">
                @yield('content')
            </div>
        </main>
    </div>

    <!-- JavaScript -->
    <script src="{{ asset('js/app.js') }}"></script>
    <script src="{{ asset('js/script.js') }}"></script>
    @stack('scripts')
</body>
</html>