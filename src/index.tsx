import React from 'react';
import {
  PluginClient,
  usePlugin,
  Layout,
  Tabs,
  Tab,
  DataTable,
  DataTableColumn,
  createDataSource,
} from 'flipper-plugin';
import {Button} from 'antd';

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
};

export function plugin(client: PluginClient<Events, {}>) {
  const data = createDataSource<Data, 'time'>([], {key: 'time'});

  client.onMessage('newData', newData => {
    data.append(newData);
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

  return {data, clearLogs};
}

export function Component() {
  const instance = usePlugin(plugin);

  return (
    <Layout.Container grow>
      <Tabs grow>
        <Tab tab="Actions">
          <DataTable
            columns={baseColumns}
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
