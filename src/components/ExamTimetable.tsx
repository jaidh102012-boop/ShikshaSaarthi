import React, { useState, useRef } from 'react';
import { Plus, Trash2, Save, X, FileDown, Upload } from 'lucide-react';
import { ExamTimetable, ExamTimetableRow } from '../types';
import { parseCSV, downloadFile } from '../utils/exportUtils';

interface ExamTimetableProps {
  examTimetable: ExamTimetable;
  onUpdate: (updates: Partial<ExamTimetable>) => void;
  onPublish: () => void;
  isEditing: boolean;
}

export default function ExamTimetableComponent({ examTimetable, onUpdate, onPublish, isEditing }: ExamTimetableProps) {
  const [rows, setRows] = useState<ExamTimetableRow[]>(examTimetable.rows);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addRow = () => {
    const newRow: ExamTimetableRow = {
      id: `row_${Date.now()}`,
      date: '',
      day: '',
      startTime: '',
      endTime: '',
      subject: '',
      class: '',
      room: '',
      invigilator: ''
    };
    const newRows = [...rows, newRow];
    setRows(newRows);
    onUpdate({ rows: newRows });
  };

  const deleteRow = (id: string) => {
    const newRows = rows.filter(row => row.id !== id);
    setRows(newRows);
    onUpdate({ rows: newRows });
  };

  const updateRow = (id: string, field: keyof ExamTimetableRow, value: string) => {
    const newRows = rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setRows(newRows);
    onUpdate({ rows: newRows });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Day', 'Start Time', 'End Time', 'Subject', 'Class', 'Room', 'Invigilator'];
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        [row.date, row.day, row.startTime, row.endTime, row.subject, row.class, row.room, row.invigilator].join(',')
      )
    ].join('\n');

    downloadFile(csvContent, `exam-timetable-${examTimetable.id}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const importedRows: ExamTimetableRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < 6) continue;

          const row: ExamTimetableRow = {
            id: `row_${Date.now()}_${i}`,
            date: values[0] || '',
            day: values[1] || '',
            startTime: values[2] || '',
            endTime: values[3] || '',
            subject: values[4] || '',
            class: values[5] || '',
            room: values[6] || '',
            invigilator: values[7] || ''
          };
          importedRows.push(row);
        }

        const newRows = [...rows, ...importedRows];
        setRows(newRows);
        onUpdate({ rows: newRows });
        alert(`Successfully imported ${importedRows.length} exam entries`);
      } catch (error) {
        console.error('CSV import error:', error);
        alert('Failed to import CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const columns: Array<{ key: keyof ExamTimetableRow; label: string; width: string }> = [
    { key: 'date', label: 'Date', width: 'w-24' },
    { key: 'day', label: 'Day', width: 'w-20' },
    { key: 'startTime', label: 'Start Time', width: 'w-24' },
    { key: 'endTime', label: 'End Time', width: 'w-24' },
    { key: 'subject', label: 'Subject', width: 'w-32' },
    { key: 'class', label: 'Class', width: 'w-20' },
    { key: 'room', label: 'Room', width: 'w-20' },
    { key: 'invigilator', label: 'Invigilator', width: 'w-32' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">{examTimetable.name}</h3>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={addRow}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </button>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/exam-timetable-template.csv';
                  link.download = 'exam-timetable-template.csv';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </button>
              <button
                onClick={exportToCSV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`${col.width} px-4 py-3 text-left text-sm font-medium text-gray-700`}>
                  {col.label}
                </th>
              ))}
              {isEditing && <th className="w-12 px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? columns.length + 1 : columns.length} className="px-4 py-8 text-center text-gray-500">
                  No exam scheduled. {isEditing ? 'Click "Add Row" to start.' : 'Waiting for admin to create exam timetable.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.key} className={`${col.width} px-4 py-3 text-sm text-gray-900`}>
                      {isEditing ? (
                        col.key === 'date' ? (
                          <input
                            type="date"
                            value={row[col.key]}
                            onChange={(e) => updateRow(row.id, col.key, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : col.key === 'startTime' || col.key === 'endTime' ? (
                          <input
                            type="time"
                            value={row[col.key]}
                            onChange={(e) => updateRow(row.id, col.key, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row[col.key]}
                            onChange={(e) => updateRow(row.id, col.key, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        )
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                  {isEditing && (
                    <td className="w-12 px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!examTimetable.isPublished && isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-3">Ready to publish this exam timetable to students and teachers?</p>
          <button
            onClick={onPublish}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Publish Timetable
          </button>
        </div>
      )}

      {examTimetable.isPublished && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">Published on {new Date(examTimetable.updatedAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
