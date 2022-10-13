import {EditOutlined} from '@ant-design/icons';
import {Button, Input, Modal, Select, Typography} from 'antd';
import {
  CodeBlock,
  DataTable,
  DetailSidebar,
  Layout,
  Panel,
  createDataSource,
  createState,
  theme,
  usePlugin,
  useValue,
} from 'flipper-plugin';
import React, {useEffect, useState} from 'react';
import {
  BOOLEAN_OPTIONS,
  MAIN_COLUMNS,
  SIDEBAR_COLUMNS,
  getRowStyle,
  isNumeric,
} from './helpers';
import {NoRecord} from './norecord';
import styles from './styles';
import type {PluginClient} from 'flipper-plugin';

export function plugin(client: PluginClient<Events, Methods>) {
  const data = createDataSource<Data, 'dkey'>([], {key: 'dkey'});
  const supportStatus = createState<string | null>(null);
  const selectedDataID = createState<string | null>(null);
  const showEditDialog = createState(false);

  client.onConnect(() => {
    console.log('connected');
  });

  client.onMessage('newData', newData => {
    data.append({
      ...newData,
      dkey: newData.instanceID + newData.key + newData.time,
    });
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
    handler: () => {
      data.clear();
    },
  });

  function clearLogs() {
    data.clear();
  }

  function onSelect(d: string | null) {
    selectedDataID.set(d);
  }

  function openEditDialog() {
    showEditDialog.set(true);
  }

  function closeEditDialog() {
    showEditDialog.set(false);
  }

  function onEditValue(newValue: unknown) {
    const id = selectedDataID.get();
    if (id) {
      const d = data.getById(id);
      if (d) {
        void client.send('editValue', {data: d, newValue});
        showEditDialog.set(false);
        selectedDataID.set(null);
      }
    }
  }

  function onDelete() {
    const id = selectedDataID.get();
    if (id) {
      const d = data.getById(id);
      if (d) {
        void client.send('deleteItem', {data: d});
        showEditDialog.set(false);
        selectedDataID.set(null);
      }
    }
  }

  return {
    data,
    supportStatus,
    selectedDataID,
    showEditDialog,
    onEditValue,
    onDelete,
    onSelect,
    openEditDialog,
    closeEditDialog,
    clearLogs,
  };
}

export function Component() {
  const instance = usePlugin(plugin);
  const supportStatus = useValue(instance.supportStatus);
  const extraActions = (
    <Layout.Horizontal gap>
      <Button title="Clear logs" onClick={instance.clearLogs}>
        Clear logs
      </Button>
    </Layout.Horizontal>
  );

  return (
    <Layout.Container grow>
      {!!supportStatus && (
        <Layout.Container pad style={styles.errorBG}>
          <Typography.Text style={styles.whiteText}>
            {supportStatus}
          </Typography.Text>
        </Layout.Container>
      )}
      <DataTable
        enableAutoScroll
        columns={MAIN_COLUMNS}
        dataSource={instance.data}
        enableHorizontalScroll={false}
        extraActions={extraActions}
        onRowStyle={getRowStyle}
        onSelect={record => {
          if (record) {
            instance.onSelect(record.time);
          } else {
            instance.onSelect(null);
          }
        }}
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
  const selectedDataID = useValue(instance.selectedDataID);
  const [selectedData, setSelectedData] = useState<Data | null>(null);
  const [newBoolValue, setNewBoolValue] = useState(true);
  const [newStringValue, setNewStringValue] = useState('');
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (selectedDataID) {
      const d = instance.data.getById(selectedDataID);
      if (d) {
        setNewValue(d);
        setSelectedData(d);
      } else {
        setSelectedData(null);
      }
    } else {
      setSelectedData(null);
    }
  }, [selectedDataID]);

  function setNewValue(d: Data) {
    switch (typeof d.value) {
      case 'boolean':
        setNewBoolValue(d.value);
        break;
      case 'string':
      case 'number':
        setNewStringValue(`${d.value}`);
        break;
      case 'object':
        setNewStringValue(JSON.stringify(d.value, null, 2));
        break;
      default:
        break;
    }
  }

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
        case 'array':
          {
            try {
              const arr = JSON.parse(newStringValue);
              if (Array.isArray(arr)) {
                instance.onEditValue(arr);
              } else {
                setErrorText("Syntax error: this isn't an array!");
              }
            } catch (error) {
              if (error instanceof Error) {
                setErrorText('Syntax error: ' + error.message);
              } else {
                setErrorText('Syntax error');
              }
            }
          }
          break;
        case 'object':
          {
            try {
              const obj = JSON.parse(newStringValue);
              if (typeof obj === 'object' && !Array.isArray(obj)) {
                instance.onEditValue(obj);
              } else {
                setErrorText("Syntax error: this isn't an object!");
              }
            } catch (error) {
              if (error instanceof Error) {
                setErrorText('Syntax error: ' + error.message);
              } else {
                setErrorText('Syntax error');
              }
            }
          }
          break;
        default:
          break;
      }
    }
  }

  function onCancel() {
    instance.closeEditDialog();
    setErrorText('');
    if (selectedData) {
      setNewValue(selectedData);
    }
  }

  const onChangeNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumeric(e.target.value)) {
      setErrorText('');
      setNewStringValue(e.target.value);
    }
  };

  const onChangeString = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setErrorText('');
    setNewStringValue(e.target.value);
  };

  return (
    <Modal
      title="Edit value"
      visible={showEditDialog}
      onCancel={onCancel}
      onOk={onOK}>
      <Typography.Text>Instance ID: {selectedData?.instanceID}</Typography.Text>
      <br />
      <Typography.Text>Key: {selectedData?.key}</Typography.Text>
      <br />
      <Typography.Text>Type: {selectedData?.type}</Typography.Text>
      <br />
      <Typography.Text style={styles.yellowText}>
        Make sure you enter correct type of value!
      </Typography.Text>
      <br />
      <br />
      {selectedData?.type === 'boolean' && (
        <Select
          options={BOOLEAN_OPTIONS}
          value={newBoolValue}
          onChange={v => {
            setNewBoolValue(v);
          }}
        />
      )}
      {selectedData?.type === 'number' && (
        <Input value={newStringValue} onChange={onChangeNumber} />
      )}
      {(selectedData?.type === 'string' ||
        selectedData?.type === 'array' ||
        selectedData?.type === 'object') && (
        <Input.TextArea
          autoSize={{minRows: 2, maxRows: 6}}
          style={selectedData.type !== 'string' ? theme.monospace : undefined}
          value={newStringValue}
          onChange={onChangeString}
        />
      )}
      {!!errorText && (
        <Typography.Text style={styles.errorBold}>{errorText}</Typography.Text>
      )}
      <br />
      <br />
      <Button danger onClick={instance.onDelete}>
        Delete item
      </Button>
    </Modal>
  );
}

function Sidebar() {
  const instance = usePlugin(plugin);
  const selectedDataID = useValue(instance.selectedDataID);

  if (!selectedDataID) {
    return NoRecord;
  }

  const selectedData = instance.data.getById(selectedDataID);

  if (!selectedData) {
    return NoRecord;
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
        columns={SIDEBAR_COLUMNS}
        enableHorizontalScroll={false}
        enableSearchbar={false}
        records={records}
        scrollable={false}
      />
      {selectedData.mode !== 'DELETE' && (
        <Panel
          pad
          collapsible={false}
          extraActions={
            <EditOutlined
              title="Edit this value"
              onClick={instance.openEditDialog}
            />
          }
          title="Value">
          <CodeBlock>{parsedValue()}</CodeBlock>
        </Panel>
      )}
    </Layout.Container>
  );
}
