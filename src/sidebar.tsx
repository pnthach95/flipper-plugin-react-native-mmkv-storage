import {EditOutlined} from '@ant-design/icons';
import {Typography} from 'antd';
import {
  CodeBlock,
  DataTable,
  Layout,
  Panel,
  usePlugin,
  useValue,
} from 'flipper-plugin';
import React from 'react';
import {plugin} from '.';
import type {DataTableColumn} from 'flipper-plugin';

const NoRecord = (
  <Layout.Container pad grow center>
    <Typography.Text type="secondary">No record selected</Typography.Text>
  </Layout.Container>
);

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
        columns={columns}
        enableHorizontalScroll={false}
        enableSearchbar={false}
        records={records}
        scrollable={false}
      />
      {selectedData.mode !== 'DELETE' && (
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
      )}
    </Layout.Container>
  );
}

export const columns: DataTableColumn[] = [
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

export default Sidebar;
