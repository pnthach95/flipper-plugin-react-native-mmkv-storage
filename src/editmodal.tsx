import {Input, Modal, Select, Typography} from 'antd';
import {usePlugin, useValue} from 'flipper-plugin';
import React, {useEffect, useState} from 'react';
import {plugin} from '.';
import styles from './styles';

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
      setNewStringValue(`${selectedData.value}`);
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
      onCancel={instance.closeEditDialog}>
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
      {selectedData?.type === 'string' && (
        <Input.TextArea value={newStringValue} onChange={onChangeString} />
      )}
      {!!errorText && (
        <Typography.Text style={styles.errorBold}>{errorText}</Typography.Text>
      )}
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
