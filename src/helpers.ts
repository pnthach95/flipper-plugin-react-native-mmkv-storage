import styles from './styles';
import type {DataTableColumn} from 'flipper-plugin';

export function isNumeric(str: string) {
  if (typeof str !== 'string') return false; // we only process strings!
  return (
    //@ts-ignore
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export function getRowStyle(row: Data) {
  return row.mode === 'DELETE' ? styles.error : undefined;
}

export const BOOLEAN_OPTIONS = [
  {label: 'true', value: true},
  {label: 'false', value: false},
];

export const SIDEBAR_COLUMNS: DataTableColumn[] = [
  {
    key: 'key',
    width: 100,
    title: 'Title',
  },
  {
    key: 'value',
    title: 'Value',
    wrap: true,
  },
];

export const MAIN_COLUMNS: DataTableColumn<Data>[] = [
  {
    key: 'time',
    title: 'Time',
    formatters: (value: string) => {
      const d = new Date(value);
      return d.toLocaleString();
    },
  },
  {
    key: 'instanceID',
    title: 'Instance ID',
    width: 120,
  },
  {
    key: 'mode',
    title: 'Mode',
    width: 80,
  },
  {
    key: 'key',
    title: 'Key',
    width: 120,
  },
  {
    key: 'type',
    title: 'Type',
    width: 80,
  },
  {
    key: 'value',
    title: 'Value',
  },
];
