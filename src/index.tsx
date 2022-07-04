import React, {useEffect, useState} from 'react';
import {
  CodeBlock,
  createDataSource,
  createState,
  DataTable,
  DataTableColumn,
  DetailSidebar,
  Layout,
  Panel,
  PluginClient,
  theme,
  usePlugin,
  useValue,
} from 'flipper-plugin';
import {Button, Input, Modal, Select, Typography} from 'antd';
import {EditOutlined} from '@ant-design/icons';

type Data = {
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
};

export function plugin(client: PluginClient<Events, Methods>) {
  const data = createDataSource<Data, 'time'>([], {key: 'time'});
  const supportStatus = createState<string | null>(null);
  const selectedData = createState<Data | null>(null);
  const showEditDialog = createState(false);

  client.onMessage('newData', newData => {
    data.append(newData);
  });

  client.onMessage('supportStatus', status => {
    if (status.reason) {
      supportStatus.set(status.reason);
    } else {
      supportStatus.set(null);
    }
  });

  client.addMenuEntry({
    action: 'clear',
    handler: async () => {
      data.clear();
    },
  });

  function clearLogs() {
    data.clear();
  }

  function onSelect(d: Data) {
    selectedData.set(d);
  }

  function openEditDialog() {
    showEditDialog.set(true);
  }

  function closeEditDialog() {
    showEditDialog.set(false);
  }

  function onEditValue(newValue: unknown) {
    const data = selectedData.get();
    if (data) {
      client.send('editValue', {data, newValue}).finally(() => {
        showEditDialog.set(false);
      });
    }
  }

  return {
    data,
    supportStatus,
    selectedData,
    showEditDialog,
    onEditValue,
    onSelect,
    openEditDialog,
    closeEditDialog,
    clearLogs,
  };
}

export function Component() {
  const instance = usePlugin(plugin);
  const supportStatus = useValue(instance.supportStatus);

  return (
    <Layout.Container grow>
      {!!supportStatus && (
        <Layout.Container pad style={errorBGStyle}>
          <Typography.Text style={{color: 'white'}}>
            {supportStatus}
          </Typography.Text>
        </Layout.Container>
      )}
      <DataTable
        columns={baseColumns}
        dataSource={instance.data}
        enableAutoScroll
        enableHorizontalScroll={false}
        extraActions={
          <Layout.Horizontal gap>
            <Button title="Clear logs" onClick={instance.clearLogs}>
              Clear logs
            </Button>
          </Layout.Horizontal>
        }
        onRowStyle={getRowStyle}
        onSelect={instance.onSelect}
      />
      <DetailSidebar>
        <Sidebar />
      </DetailSidebar>
      <EditModal />
    </Layout.Container>
  );
}

function EditModal() {
  const instance = usePlugin(plugin);
  const showEditDialog = useValue(instance.showEditDialog);
  const selectedData = useValue(instance.selectedData);
  const [newBoolValue, setNewBoolValue] = useState(selectedData?.value);
  const [newStringValue, setNewStringValue] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (typeof selectedData?.value === 'boolean') {
      setNewBoolValue(selectedData.value);
    }
    if (
      typeof selectedData?.value === 'string' ||
      typeof selectedData?.value === 'number'
    ) {
      setNewStringValue(selectedData.value);
    }
  }, [selectedData?.value]);

  function onOK() {
    if (selectedData) {
      switch (selectedData.type) {
        case 'boolean':
          instance.onEditValue(newBoolValue);
          break;
        case 'string':
          instance.onEditValue(newStringValue);
          break;
        case 'number':
          if (isNumeric(newStringValue)) {
            instance.onEditValue(parseFloat(newStringValue));
          } else {
            setErrorText('Your input is not number!');
          }
          break;
        default:
          break;
      }
    }
  }

  return (
    <Modal
      visible={showEditDialog}
      title="Edit value"
      onOk={onOK}
      onCancel={instance.closeEditDialog}>
      <Typography.Text>Instance ID: {selectedData?.instanceID}</Typography.Text>
      <br />
      <Typography.Text>Key: {selectedData?.key}</Typography.Text>
      <br />
      <Typography.Text>Type: {selectedData?.type}</Typography.Text>
      <br />
      <Typography.Text style={{color: 'yellow'}}>
        Make sure you enter correct type of value!
      </Typography.Text>
      <br />
      <br />
      {selectedData?.type === 'boolean' && (
        <Select
          value={newBoolValue}
          options={booleanOptions}
          onChange={v => {
            setNewBoolValue(v);
          }}
        />
      )}
      {(selectedData?.type === 'number' || selectedData?.type === 'string') && (
        <>
          <Input
            value={newStringValue}
            onChange={e => {
              setErrorText('');
              setNewStringValue(e.target.value);
            }}
          />
          {!!errorText && (
            <Typography.Text style={{color: 'red', fontWeight: 'bold'}}>
              {errorText}
            </Typography.Text>
          )}
        </>
      )}
    </Modal>
  );
}

function Sidebar() {
  const instance = usePlugin(plugin);
  const selectedData = useValue(instance.selectedData);

  if (!selectedData) {
    return (
      <Layout.Container pad grow center>
        <Typography.Text type="secondary">No record selected</Typography.Text>
      </Layout.Container>
    );
  }

  const records =
    selectedData.mode === 'DELETE'
      ? [
          {key: 'Instance ID', value: selectedData.instanceID},
          {key: 'Mode', value: selectedData.mode},
          {key: 'Key', value: selectedData.key},
        ]
      : [
          {key: 'Instance ID', value: selectedData.instanceID},
          {key: 'Mode', value: selectedData.mode},
          {key: 'Key', value: selectedData.key},
          {key: 'Type', value: selectedData.type},
        ];

  function parsedValue() {
    const v = selectedData?.value;
    const t = selectedData?.type;
    if (v === null) {
      return 'null';
    }
    if (v === undefined) {
      return 'undefined';
    }
    switch (t) {
      case 'array':
      case 'object':
        return JSON.stringify(v, null, 2);
      case 'boolean':
        if (v) {
          return 'true';
        }
        return 'false';
      case 'number':
        return `${v as number}`;
      case 'string':
        return v as string;
      default:
        return '';
    }
  }

  return (
    <Layout.Container grow>
      <DataTable
        columns={sidebarColumns}
        enableHorizontalScroll={false}
        enableSearchbar={false}
        records={records}
        scrollable={false}
      />
      {selectedData.mode !== 'DELETE' && (
        <>
          <Panel
            extraActions={
              selectedData.type === 'boolean' ||
              selectedData.type === 'number' ||
              selectedData.type === 'string' ? (
                <EditOutlined
                  title="Edit this value"
                  onClick={instance.openEditDialog}
                />
              ) : null
            }
            pad
            title="Value">
            <CodeBlock>{parsedValue()}</CodeBlock>
          </Panel>
        </>
      )}
    </Layout.Container>
  );
}

const sidebarColumns: DataTableColumn[] = [
  {
    key: 'key',
    width: 100,
    title: 'Key',
  },
  {
    key: 'value',
    title: 'Value',
    wrap: true,
  },
];

const baseColumns: DataTableColumn<Data>[] = [
  {
    key: 'time',
    title: 'Time',
    formatters: value => {
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

const booleanOptions = [
  {label: 'true', value: true},
  {label: 'false', value: false},
];

const errorStyle = {
  color: theme.errorColor,
};

const errorBGStyle: React.CSSProperties = {
  backgroundColor: theme.errorColor,
};

function getRowStyle(row: Data) {
  return row.mode === 'DELETE' ? errorStyle : undefined;
}

function isNumeric(str: string) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    //@ts-ignore
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
