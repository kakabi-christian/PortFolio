<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Récupérer le projet en cours de modification (si on est en mode update)
        $projectId = $this->route('project') ? $this->route('project')->id : null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('projects', 'slug')->ignore($projectId),
            ],
            'description' => ['required', 'string'],
            // Utiliser la même règle standard et propre que pour les tools
            'image_url' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'demo_url' => ['nullable', 'url', 'max:255'],
            'featured' => ['sometimes', 'boolean'],
        ];
    }
}
