import {Button, Input, Modal, Select, Typography} from 'antd';
import {theme, usePlugin, useValue} from 'flipper-plugin';
import React, {useEffect, useState} from 'react';
import {plugin} from '.';
import styles from './styles';

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
      visible={showEditDialog}
      title="Edit value"
      onOk={onOK}
      onCancel={onCancel}>
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
          value={newBoolValue}
          options={booleanOptions}
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
          value={newStringValue}
          style={selectedData.type !== 'string' ? theme.monospace : undefined}
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

const booleanOptions = [
  {label: 'true', value: true},
  {label: 'false', value: false},
];

function isNumeric(str: string) {
  if (typeof str !== 'string') return false; // we only process strings!
  return (
    //@ts-ignore
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export default EditModal;
