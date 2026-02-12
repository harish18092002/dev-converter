import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  // JSON <-> XML (dynamic import: xml-js)
  async jsonToXml(jsonStr: string): Promise<string> {
    const obj = JSON.parse(jsonStr);
    const xmlJs = await import('xml-js');
    return xmlJs.js2xml(obj, { compact: true, spaces: 2 });
  }

  async xmlToJson(xmlStr: string): Promise<string> {
    const xmlJs = await import('xml-js');
    const obj = xmlJs.xml2js(xmlStr, { compact: true });
    return JSON.stringify(obj, null, 2);
  }

  // JSON <-> YAML (dynamic import: js-yaml)
  async jsonToYaml(jsonStr: string): Promise<string> {
    const obj = JSON.parse(jsonStr);
    const yaml = await import('js-yaml');
    return yaml.dump(obj);
  }

  async yamlToJson(yamlStr: string): Promise<string> {
    const yaml = await import('js-yaml');
    const obj = yaml.load(yamlStr);
    return JSON.stringify(obj, null, 2);
  }

  // JSON <-> CSV (dynamic import: papaparse)
  async jsonToCsv(jsonStr: string): Promise<string> {
    const obj = JSON.parse(jsonStr);
    const papa = await import('papaparse');
    const data = Array.isArray(obj) ? obj : [obj];
    return papa.unparse(data);
  }

  async csvToJson(csvStr: string): Promise<string> {
    const papa = await import('papaparse');
    const result = papa.parse(csvStr, { header: true });
    if (result.errors.length > 0) throw new Error('CSV Parsing Error');
    return JSON.stringify(result.data, null, 2);
  }

  // JSON -> SQL (pure JS — no external lib needed)
  jsonToSql(jsonStr: string, tableName: string = 'table_name'): string {
    try {
      const data = JSON.parse(jsonStr);
      const rows = Array.isArray(data) ? data : [data];

      if (rows.length === 0) return '';

      const keys = Object.keys(rows[0]);
      const columns = keys.join(', ');

      const values = rows
        .map((row: any) => {
          const vals = keys
            .map((key) => {
              const val = row[key];
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 1 : 0;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return `'${String(val).replace(/'/g, "''")}'`;
            })
            .join(', ');
          return `(${vals})`;
        })
        .join(',\n');

      return `INSERT INTO ${tableName} (${columns}) VALUES\n${values};`;
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
  // Base64
  toBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }

  fromBase64(str: string): string {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      throw new Error('Invalid Base64 string');
    }
  }
}
