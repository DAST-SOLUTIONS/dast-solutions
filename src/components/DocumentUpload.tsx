type Props = { projectId: string }

export function DocumentUpload({ projectId }: Props) {
  return (
    <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
      <p className="text-gray-700 font-medium">Glissez vos fichiers ici</p>
      <p className="text-sm text-gray-500">PDF / DWG / RVT / IFC</p>
      <div className="mt-4">
        <input type="file" multiple className="block mx-auto" />
      </div>
    </div>
  )
}
