<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DatabaseRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // ID de la base de données en cours de mise à jour (pour ignorer l'unicité sur le nom lors d'un update)
        $databaseId = $this->route('database')->id ?? null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('databases')->ignore($databaseId),
            ],
            'type' => [
                'required',
                // Validation stricte par rapport à l'enum de la migration
                Rule::in(['Relationnelle', 'NoSQL']),
            ],
            'level' => [
                'required',
                'string',
                'max:50',
            ],
            // Validation de l'icône / image
            'icon' => [
                'nullable',
                'image', // S'assure que c'est un fichier image (jpeg, png, jpg, gif, svg, etc.)
                'mimes:jpeg,png,jpg,svg,webp',
                'max:2048', // Taille maximale en Ko (2 Mo)
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la base de données est obligatoire.',
            'name.unique' => 'Ce nom de base de données est déjà utilisé.',
            'type.required' => 'Le type de base de données est obligatoire.',
            'type.in' => 'Le type sélectionné n\'est pas valide.',
            'level.required' => 'Le niveau est obligatoire.',
            'icon.image' => 'Le fichier doit être une image valide.',
            'icon.mimes' => 'L\'image doit être de type : jpeg, png, jpg, svg ou webp.',
            'icon.max' => 'L\'image ne doit pas dépasser 2 Mo.',
        ];
    }
}