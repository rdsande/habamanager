<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    protected static function bootAuditable()
    {
        static::created(function ($model) {
            $model->auditLog('created', null, $model->toArray());
        });

        static::updated(function ($model) {
            $original = $model->getOriginal();
            $changes = $model->getChanges();
            
            if (!empty($changes)) {
                $model->auditLog('updated', $original, $changes);
            }
        });

        static::deleted(function ($model) {
            $model->auditLog('deleted', $model->toArray(), null);
        });
    }

    protected function auditLog($action, $oldValues = null, $newValues = null)
    {
        AuditLog::create([
            'table_name' => $this->getTable(),
            'record_id' => $this->getKey(),
            'action' => $action,
            'old_values' => $oldValues ? json_encode($oldValues) : null,
            'new_values' => $newValues ? json_encode($newValues) : null,
            'user_id' => Auth::id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}