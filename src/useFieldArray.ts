import * as React from 'react';
import { useFormContext } from './useFormContext';
import generateId from './logic/generateId';
import isUndefined from './utils/isUndefined';
import isArray from './utils/isArray';
import { FieldValues, UseFieldArrayProps, WithFieldId } from './types';

export const appendId = <
  FormArrayValues extends {
    id?: string;
  } & FieldValues = FieldValues
>(
  value: FormArrayValues,
) => ({
  ...value,
  ...(value.id ? {} : { id: generateId() }),
});

const mapIds = (data: any) =>
  (isArray(data) ? data : []).map(value => appendId(value));

export function useFieldArray<
  FormArrayValues extends FieldValues = FieldValues
>({ control, name }: UseFieldArrayProps) {
  const methods = useFormContext() || {};
  const {
    getValues,
    defaultValuesRef,
    reRender,
    resetFieldArrayFunctionRef,
    fields: globalFields,
    unregister,
  } = control || methods.control;

  const [fields, setField] = React.useState<WithFieldId<FormArrayValues>[]>(
    mapIds(getValues({ nest: true })[name]),
  );

  const resetFields = () => {
    for (const key in globalFields) {
      if (key.startsWith(`${name}[`)) {
        unregister(key);
      }
    }
  };

  const prepend = (value: WithFieldId<FormArrayValues>) => {
    resetFields();
    setField([appendId(value), ...fields]);
  };

  const append = (value: WithFieldId<FormArrayValues>) =>
    setField([...fields, appendId(value)]);

  const remove = (index?: number) => {
    resetFields();
    setField(
      isUndefined(index)
        ? []
        : [...fields.slice(0, index), ...fields.slice(index + 1)],
    );
  };

  const insert = (index: number, value: WithFieldId<FormArrayValues>) => {
    resetFields();
    setField([
      ...fields.slice(0, index),
      appendId(value),
      ...fields.slice(index),
    ]);
  };

  const swap = (indexA: number, indexB: number) => {
    [fields[indexA], fields[indexB]] = [fields[indexB], fields[indexA]];
    setField(fields);
    reRender();
  };

  const move = (from: number, to: number) => {
    fields.splice(to, 0, fields.splice(from, 1)[0]);
    setField(fields);
    reRender();
  };

  const reset = (value: any) => setField(mapIds(value[name]));

  React.useEffect(() => {
    const resetFunctions = resetFieldArrayFunctionRef.current;
    defaultValuesRef.current[name] = {};
    resetFunctions[name] = reset;

    return () => {
      delete resetFunctions[name];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return {
    swap,
    move,
    prepend,
    append,
    remove,
    insert,
    fields,
  };
}
