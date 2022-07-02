import React from 'react';
import {
  createDataSource,
  createState,
  DataTable,
  DataTableColumn,
  Layout,
  PluginClient,
  Tab,
  Tabs,
  theme,
  usePlugin,
  useValue,
} from 'flipper-plugin';
import {Button, Typography} from 'antd';

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
  supportStatus: string;
};

export function plugin(client: PluginClient<Events, {}>) {
  const data = createDataSource<Data, 'time'>([], {key: 'time'});
  const supportStatus = createState<string | null>(null);

  client.onMessage('newData', newData => {
    data.append(newData);
  });

  client.onMessage('supportStatus', (reason: string) => {
    if (reason) {
      supportStatus.set(reason);
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

  return {data, supportStatus, clearLogs};
}

export function Component() {
  const instance = usePlugin(plugin);
  const supportStatus = useValue(instance.supportStatus);

  return (
    <Layout.Container grow>
      {!!supportStatus && (
        <Layout.Container style={errorBGStyle}>
          <Typography.Text>{supportStatus}</Typography.Text>
        </Layout.Container>
      )}
      <Tabs grow>
        <Tab tab="Actions">
          <DataTable
            columns={baseColumns}
            enableAutoScroll
            onRowStyle={getRowStyle}
            dataSource={instance.data}
            extraActions={
              <Layout.Horizontal gap>
                <Button title="Clear logs" onClick={instance.clearLogs}>
                  Clear logs
                </Button>
              </Layout.Horizontal>
            }
          />
        </Tab>
        <Tab tab="Data">{/* TODO: Manipulate value */}</Tab>
      </Tabs>
    </Layout.Container>
  );
}

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
    wrap: true,
  },
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
