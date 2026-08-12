<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $table = 'projects';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'image_url',
        'github_url',
        'demo_url',
        'featured',
    ];

    protected $casts = [
        'featured' => 'boolean',
    ];
}
