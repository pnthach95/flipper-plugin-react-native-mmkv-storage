type Data = {
  dkey: string;
  instanceID: string;
  mode: 'READ' | 'WRITE' | 'DELETE';
  key: string;
  type: 'array' | 'boolean' | 'number' | 'object' | 'string';
  value: unknown;
  time: string;
};

type Events = {
  newData: Data;
  supportStatus: {reason: string | null};
};

type Methods = {
  editValue: (state: {data: Data; newValue: unknown}) => Promise<void>;
  deleteItem: (state: {data: Data}) => Promise<void>;
};
