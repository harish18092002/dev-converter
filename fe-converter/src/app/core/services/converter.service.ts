import { Injectable } from '@angular/core';
import * as yaml from 'js-yaml';
import * as papa from 'papaparse';
import * as xmlJs from 'xml-js';
import * as XLSX from 'xlsx';
import { format as sqlFormat } from 'sql-formatter';

@Injectable({
  providedIn: 'root',
})
export class ConverterService {
  // JSON <-> XML
  jsonToXml(jsonStr: string): string {
    try {
      const obj = JSON.parse(jsonStr);
      return xmlJs.js2xml(obj, { compact: true, spaces: 2 });
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }

  xmlToJson(xmlStr: string): string {
    try {
      const obj = xmlJs.xml2js(xmlStr, { compact: true });
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      throw new Error('Invalid XML');
    }
  }

  // JSON <-> YAML
  jsonToYaml(jsonStr: string): string {
    try {
      const obj = JSON.parse(jsonStr);
      return yaml.dump(obj);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }

  yamlToJson(yamlStr: string): string {
    try {
      const obj = yaml.load(yamlStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      throw new Error('Invalid YAML');
    }
  }

  // JSON <-> CSV
  jsonToCsv(jsonStr: string): string {
    try {
      const obj = JSON.parse(jsonStr);
      const data = Array.isArray(obj) ? obj : [obj];
      return papa.unparse(data);
    } catch (e) {
      throw new Error('Invalid JSON. Must be an array of objects or a single object.');
    }
  }

  csvToJson(csvStr: string): string {
    try {
      const result = papa.parse(csvStr, { header: true });
      if (result.errors.length > 0) throw new Error('CSV Parsing Error');
      return JSON.stringify(result.data, null, 2);
    } catch (e) {
      throw new Error('Invalid CSV');
    }
  }

  // JSON -> SQL
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
