<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'action',
        'table_name',
        'record_id',
        'old_values',
        'new_values',
        'user_agent',
        'ip_address'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array'
    ];
}
