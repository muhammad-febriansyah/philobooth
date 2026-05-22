<?php

namespace App\Models\Concerns;

use App\Enums\UserRole;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Apply ke model yang punya kolom `branch_id`.
 *
 * - Auto-filter query ke branch_id user yang login (kecuali admin global)
 * - Auto-set branch_id saat create
 */
trait BelongsToBranch
{
    protected static function bootBelongsToBranch(): void
    {
        static::addGlobalScope('branch', function ($query) {
            $user = auth()->user();

            if (! $user) {
                return;
            }

            if ($user->hasRole(UserRole::Admin->value)) {
                return;
            }

            if ($user->branch_id) {
                $query->where($query->getModel()->getTable().'.branch_id', $user->branch_id);
            }
        });

        static::creating(function ($model) {
            if ($model->branch_id) {
                return;
            }

            $user = auth()->user();

            if ($user?->branch_id) {
                $model->branch_id = $user->branch_id;
            }
        });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
