interface PageTitleProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageTitle({ title, subtitle, actions }: PageTitleProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageTitle
