// src/Components/SchemaBuilder.js

import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import './SchemaBuilder.css';

const propertyTypes = ['string', 'number', 'boolean', 'object', 'array'];

const SchemaBuilder = ({ initialSchema, onMetricsChange, onSchemaChange, schemaType }) => {
  const { control, register, watch, setValue } = useForm({
    defaultValues: initialSchema || {
      properties: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'properties',
  });

  const watchFields = watch('properties');

  React.useEffect(() => {
    const subscription = watch((value) => {
      // Transform the form data into JSON schema
      const schema = {
        type: 'object',
        properties: {},
        required: [],
      };

      value.properties.forEach((prop) => {
        if (prop.name) {
          schema.properties[prop.name] = {
            type: prop.type,
          };

          if (prop.type === 'object') {
            const nestedSchema = transformProperties(prop.properties || []);
            schema.properties[prop.name].properties = nestedSchema.properties;
            schema.properties[prop.name].required = nestedSchema.required;
            // Conditionally add additionalProperties
            if (Object.keys(nestedSchema.properties).length > 0) {
              schema.properties[prop.name].additionalProperties = false;
            }
          }

          if (prop.type === 'array') {
            schema.properties[prop.name].items = {
              type: prop.itemsType || 'string',
            };
            if (prop.itemsType === 'object') {
              const arrayNestedSchema = transformProperties(prop.itemsProperties || []);
              schema.properties[prop.name].items.properties = arrayNestedSchema.properties;
              schema.properties[prop.name].items.required = arrayNestedSchema.required;
              // Conditionally add additionalProperties
              if (Object.keys(arrayNestedSchema.properties).length > 0) {
                schema.properties[prop.name].items.additionalProperties = false;
              }
            }
          }

          // Add the property name to the required array
          schema.required.push(prop.name);
        }
      });

      // Remove duplicate required fields
      schema.required = [...new Set(schema.required)];

      // Conditionally add additionalProperties
      if (Object.keys(schema.properties).length > 0) {
        schema.additionalProperties = false;
      }

      // Add desired properties at the root level for output schema
      if (schemaType === 'output' && value.metrics && value.metrics.length > 0) {
        schema.metrics = value.metrics;
      }
      onMetricsChange(value.metrics);
      onSchemaChange(schema);
    });

    return () => subscription.unsubscribe();
  }, [watchFields, onSchemaChange, schemaType]);

  const transformProperties = (properties) => {
    const transformed = {
      properties: {},
      required: [],
    };
    properties.forEach((prop) => {
      if (prop.name) {
        transformed.properties[prop.name] = {
          type: prop.type,
        };

        if (prop.type === 'object') {
          const nested = transformProperties(prop.properties || []);
          transformed.properties[prop.name].properties = nested.properties;
          transformed.properties[prop.name].required = nested.required;
          // Conditionally add additionalProperties
          if (Object.keys(nested.properties).length > 0) {
            transformed.properties[prop.name].additionalProperties = false;
          }
        }

        if (prop.type === 'array') {
          transformed.properties[prop.name].items = {
            type: prop.itemsType || 'string',
          };
          if (prop.itemsType === 'object') {
            const arrayNested = transformProperties(prop.itemsProperties || []);
            transformed.properties[prop.name].items.properties = arrayNested.properties;
            transformed.properties[prop.name].items.required = arrayNested.required;
            // Conditionally add additionalProperties
            if (Object.keys(arrayNested.properties).length > 0) {
              transformed.properties[prop.name].items.additionalProperties = false;
            }
          }
        }

        transformed.required.push(prop.name);
      }
    });

    // Remove duplicates in required
    transformed.required = [...new Set(transformed.required)];

    return transformed;
  };

  const addProperty = () => {
    append({
      name: '',
      type: 'string',
      properties: [],
      required: [],
      itemsType: 'string',
      itemsProperties: [],
      itemsRequired: [],
    });
  };

  const addMetric = () => {
    const currentDesired = watch('metrics') || [];
    const newDesired = [...currentDesired, ''];
    setValue('metrics', newDesired);
  };

  const removeMetric = (desiredIndex) => {
    const currentDesired = watch('metrics') || [];
    const newDesired = currentDesired.filter((_, idx) => idx !== desiredIndex);
    setValue('metrics', newDesired);
  };

  const addNestedProperty = (parentIndex) => {
    setValue(`properties.${parentIndex}.properties`, [
      ...(watchFields[parentIndex].properties || []),
      { name: '', type: 'string' },
    ]);
    setValue(`properties.${parentIndex}.required`, [
      ...(watchFields[parentIndex].required || []),
      '',
    ]);
  };

  const removeNestedProperty = (parentIndex, nestedIndex) => {
    const updatedProperties = watchFields[parentIndex].properties.filter(
      (_, idx) => idx !== nestedIndex
    );
    setValue(`properties.${parentIndex}.properties`, updatedProperties);
  };

  const addArrayNestedProperty = (parentIndex) => {
    setValue(`properties.${parentIndex}.itemsProperties`, [
      ...(watchFields[parentIndex].itemsProperties || []),
      { name: '', type: 'string' },
    ]);
    setValue(`properties.${parentIndex}.itemsRequired`, [
      ...(watchFields[parentIndex].itemsRequired || []),
      '',
    ]);
  };

  const removeArrayNestedProperty = (parentIndex, nestedIndex) => {
    const updatedProperties = watchFields[parentIndex].itemsProperties.filter(
      (_, idx) => idx !== nestedIndex
    );
    setValue(`properties.${parentIndex}.itemsProperties`, updatedProperties);
  };

  return (
    <Paper sx={{ padding: 3, marginBottom: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Typography variant="h6">
          {schemaType === 'input' ? 'Input Schema Builder' : 'Output Schema Builder'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={addProperty}
          startIcon={<AddIcon />}
        >
          Add Property
        </Button>
      </Box>

      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{ border: '1px solid #ccc', padding: 2, marginBottom: 2, borderRadius: 1 }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Property Name"
                {...register(`properties.${index}.name`, { required: true })}
                defaultValue={field.name}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Controller
                  name={`properties.${index}.type`}
                  control={control}
                  defaultValue={field.type}
                  render={({ field: controllerField }) => (
                    <Select {...controllerField} label="Type">
                      {propertyTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <IconButton color="error" onClick={() => remove(index)}>
                <RemoveIcon />
              </IconButton>
            </Grid>

            {/* Nested Properties for Object Type */}
            {watchFields[index].type === 'object' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Nested Properties</Typography>
                {watchFields[index].properties &&
                  watchFields[index].properties.map((nestedProp, nestedIndex) => (
                    <Box
                      key={nestedIndex}
                      sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}
                    >
                      <TextField
                        label={`Nested Property ${nestedIndex + 1}`}
                        {...register(`properties.${index}.properties.${nestedIndex}.name`, {
                          required: true,
                        })}
                        defaultValue={nestedProp.name}
                        sx={{ marginRight: 1 }}
                      />
                      <FormControl sx={{ marginRight: 1, minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Controller
                          name={`properties.${index}.properties.${nestedIndex}.type`}
                          control={control}
                          defaultValue={nestedProp.type}
                          render={({ field: controllerField }) => (
                            <Select {...controllerField} label="Type">
                              {propertyTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                      </FormControl>
                      <IconButton
                        color="error"
                        onClick={() => removeNestedProperty(index, nestedIndex)}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addNestedProperty(index)}
                  startIcon={<AddIcon />}
                  sx={{ marginBottom: 1 }}
                >
                  Add Nested Property
                </Button>
              </Grid>
            )}

            {/* Nested Properties for Array Type */}
            {watchFields[index].type === 'array' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Array Items Type</Typography>
                <FormControl fullWidth sx={{ marginBottom: 2 }}>
                  <InputLabel>Items Type</InputLabel>
                  <Controller
                    name={`properties.${index}.itemsType`}
                    control={control}
                    defaultValue={watchFields[index].itemsType || 'string'}
                    render={({ field: controllerField }) => (
                      <Select {...controllerField} label="Items Type">
                        {propertyTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>

                {watchFields[index].itemsType === 'object' && (
                  <>
                    <Typography variant="subtitle1">
                      Nested Properties in Array Items
                    </Typography>
                    {watchFields[index].itemsProperties &&
                      watchFields[index].itemsProperties.map((nestedProp, nestedIndex) => (
                        <Box
                          key={nestedIndex}
                          sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}
                        >
                          <TextField
                            label={`Nested Property ${nestedIndex + 1}`}
                            {...register(
                              `properties.${index}.itemsProperties.${nestedIndex}.name`,
                              { required: true }
                            )}
                            defaultValue={nestedProp.name}
                            sx={{ marginRight: 1 }}
                          />
                          <FormControl sx={{ marginRight: 1, minWidth: 120 }}>
                            <InputLabel>Type</InputLabel>
                            <Controller
                              name={`properties.${index}.itemsProperties.${nestedIndex}.type`}
                              control={control}
                              defaultValue={nestedProp.type}
                              render={({ field: controllerField }) => (
                                <Select {...controllerField} label="Type">
                                  {propertyTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                      {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              )}
                            />
                          </FormControl>
                          <IconButton
                            color="error"
                            onClick={() => removeArrayNestedProperty(index, nestedIndex)}
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => addArrayNestedProperty(index)}
                      startIcon={<AddIcon />}
                      sx={{ marginBottom: 1 }}
                    >
                      Add Nested Property
                    </Button>
                  </>
                )}
              </Grid>
            )}
          </Grid>
        </Box>
      ))}

      {/* Desired Properties for Output Schema (at Root Level) */}
      {schemaType === 'output' && (
        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h6">Metrics</Typography>
          {watch('metrics') &&
            watch('metrics').map((dp, dpIndex) => (
              <Box
                key={dpIndex}
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}
              >
                <TextField
                  label={`Metric ${dpIndex + 1}`}
                  {...register(`metrics.${dpIndex}`)}
                  defaultValue={dp}
                  fullWidth
                />
                <IconButton
                  color="error"
                  onClick={() => removeMetric(dpIndex)}
                  sx={{ marginLeft: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}
          <Button
            variant="outlined"
            onClick={addMetric}
            startIcon={<AddIcon />}
            sx={{ marginTop: 1 }}
          >
            Add Metric
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default SchemaBuilder;
