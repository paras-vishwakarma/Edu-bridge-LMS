import { useState } from 'react'

export default function DataTable({ columns, data, onRowClick, searchable = true, searchPlaceholder = 'Search...' }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(colKey)
      setSortDir('asc')
    }
  }

  let filtered = data
  if (search && searchable) {
    const q = search.toLowerCase()
    filtered = data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : ''
        return String(val).toLowerCase().includes(q)
      })
    )
  }

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const col = columns.find(c => c.accessor === sortCol)
      const aVal = col?.accessor ? a[col.accessor] : ''
      const bVal = col?.accessor ? b[col.accessor] : ''
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="data-table-search">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="data-table-search-input"
          />
        </div>
      )}
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.accessor || col.header}
                  onClick={() => col.accessor && handleSort(col.accessor)}
                  className={col.accessor ? 'sortable' : ''}
                >
                  {col.header}
                  {sortCol === col.accessor && (
                    <span className="sort-indicator">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  No data found
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row.id || idx} onClick={() => onRowClick?.(row)} className={onRowClick ? 'clickable' : ''}>
                  {columns.map(col => (
                    <td key={col.accessor || col.header}>
                      {col.render ? col.render(row) : (col.accessor ? row[col.accessor] : '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
