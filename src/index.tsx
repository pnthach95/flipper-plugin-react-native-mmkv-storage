import React from 'react';
import {
  createDataSource,
  createState,
  DataTable,
  DetailSidebar,
  Layout,
  usePlugin,
  useValue,
} from 'flipper-plugin';
import {Button, Typography} from 'antd';
import styles from './styles';
import EditModal from './editmodal';
import Sidebar from './sidebar';
import type {PluginClient, DataTableColumn} from 'flipper-plugin';

export function plugin(client: PluginClient<Events, Methods>) {
  const data = createDataSource<Data, 'time'>([], {key: 'time'});
  const supportStatus = createState<string | null>(null);
  const selectedDataID = createState<string | null>(null);
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
        client.send('editValue', {data: d, newValue}).finally(() => {
          showEditDialog.set(false);
          selectedDataID.set(null);
        });
      }
    }
  }

  return {
    data,
    supportStatus,
    selectedDataID,
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
        columns={columns}
        dataSource={instance.data}
        enableAutoScroll
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

const columns: DataTableColumn<Data>[] = [
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

function getRowStyle(row: Data) {
  return row.mode === 'DELETE' ? styles.error : undefined;
}
