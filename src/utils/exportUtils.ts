export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportToJSON = (data: any, filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

export const exportToCSV = (data: any[], headers: string[], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToXML = (data: any, rootElement: string, filename: string) => {
  const buildXML = (obj: any, indent = ''): string => {
    let xml = '';
    for (const key in obj) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += `${indent}<${key}>\n`;
          xml += buildXML(item, indent + '  ');
          xml += `${indent}</${key}>\n`;
        });
      } else if (typeof value === 'object' && value !== null) {
        xml += `${indent}<${key}>\n`;
        xml += buildXML(value, indent + '  ');
        xml += `${indent}</${key}>\n`;
      } else {
        xml += `${indent}<${key}>${value}</${key}>\n`;
      }
    }
    return xml;
  };

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n${buildXML(data, '  ')}</${rootElement}>`;
  downloadFile(xmlContent, `${filename}.xml`, 'application/xml');
};

export const exportToSQL = (tableName: string, data: any[], filename: string) => {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const sqlStatements = data.map(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      return value;
    }).join(', ');
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
  });

  const sqlContent = `-- SQL Export for ${tableName}\n-- Generated on ${new Date().toISOString()}\n\n${sqlStatements.join('\n')}`;
  downloadFile(sqlContent, `${filename}.sql`, 'application/sql');
};

export const parseCSV = (csvContent: string): any[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
};
