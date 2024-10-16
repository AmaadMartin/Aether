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
import { v4 as uuidv4 } from 'uuid';
import './SchemaBuilder.css';

const propertyTypes = ['string', 'number', 'boolean', 'object', 'array'];

const SchemaBuilder = ({ initialSchema, onSchemaChange, schemaType }) => {
  const { control, register, handleSubmit, watch, setValue } = useForm({
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

          if (schemaType === 'output' && prop.desiredProperties && prop.desiredProperties.length > 0) {
            schema.properties[prop.name].desiredProperties = prop.desiredProperties;
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

        if (schemaType === 'output' && prop.desiredProperties && prop.desiredProperties.length > 0) {
          transformed.properties[prop.name].desiredProperties = prop.desiredProperties;
        }

        transformed.required.push(prop.name);
      }
    });

    // Remove duplicates in required
    transformed.required = [...new Set(transformed.required)];

    return transformed;
  };

  const addProperty = () => {
    const newPropertyName = "";
    append({
      name: newPropertyName,
      type: 'string',
      desiredProperties: schemaType === 'output' ? [''] : undefined,
      properties: [],
      required: [],
      itemsType: 'string',
      itemsProperties: [],
      itemsRequired: [],
    });
  };

  const addDesiredProperty = (index) => {
    const currentDesired = watchFields[index].desiredProperties || [];
    const newDesired = [...currentDesired, ''];
    setValue(`properties.${index}.desiredProperties`, newDesired);
  };

  const removeDesiredProperty = (propertyIndex, desiredIndex) => {
    const currentDesired = watchFields[propertyIndex].desiredProperties || [];
    const newDesired = currentDesired.filter((_, idx) => idx !== desiredIndex);
    setValue(`properties.${propertyIndex}.desiredProperties`, newDesired);
  };

  const addNestedProperty = (parentIndex) => {
    setValue(`properties.${parentIndex}.properties`, [
      ...(watchFields[parentIndex].properties || []),
      { name: "", type: 'string' },
    ]);
    setValue(`properties.${parentIndex}.required`, [
      ...(watchFields[parentIndex].required || []),
      "",
    ]);
  };

  const removeNestedProperty = (parentIndex, nestedIndex) => {
    const propertyName = watchFields[parentIndex].properties[nestedIndex].name;
    const updatedProperties = watchFields[parentIndex].properties.filter(
      (_, idx) => idx !== nestedIndex
    );
    const updatedRequired = watchFields[parentIndex].required.filter(
      (req) => req !== propertyName
    );
    setValue(`properties.${parentIndex}.properties`, updatedProperties);
    setValue(`properties.${parentIndex}.required`, updatedRequired);
  };

  const addArrayNestedProperty = (parentIndex) => {
    const newName = "";
    setValue(`properties.${parentIndex}.itemsProperties`, [
      ...(watchFields[parentIndex].itemsProperties || []),
      { name: newName, type: 'string' },
    ]);
    setValue(`properties.${parentIndex}.itemsRequired`, [
      ...(watchFields[parentIndex].itemsRequired || []),
      newName,
    ]);
  };

  const removeArrayNestedProperty = (parentIndex, nestedIndex) => {
    const propertyName = watchFields[parentIndex].itemsProperties[nestedIndex].name;
    const updatedProperties = watchFields[parentIndex].itemsProperties.filter(
      (_, idx) => idx !== nestedIndex
    );
    const updatedRequired = watchFields[parentIndex].itemsRequired.filter(
      (req) => req !== propertyName
    );
    setValue(`properties.${parentIndex}.itemsProperties`, updatedProperties);
    setValue(`properties.${parentIndex}.itemsRequired`, updatedRequired);
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
        <Button variant="contained" color="primary" onClick={addProperty} startIcon={<AddIcon />}>
          Add Property
        </Button>
      </Box>
      {fields.map((field, index) => (
        <Box key={field.id} sx={{ border: '1px solid #ccc', padding: 2, marginBottom: 2, borderRadius: 1 }}>
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

            {/* Desired Properties for Output Schema */}
            {schemaType === 'output' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Metrics</Typography>
                {watchFields[index].desiredProperties && watchFields[index].desiredProperties.map((dp, dpIndex) => (
                  <Box key={dpIndex} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                    <TextField
                      label={`Metric ${dpIndex + 1}`}
                      {...register(`properties.${index}.desiredProperties.${dpIndex}`)}
                      defaultValue={dp}
                      fullWidth
                    />
                    <IconButton
                      color="error"
                      onClick={() => removeDesiredProperty(index, dpIndex)}
                      sx={{ marginLeft: 1 }}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  onClick={() => addDesiredProperty(index)}
                  startIcon={<AddIcon />}
                >
                  Add Metric
                </Button>
              </Grid>
            )}

            {/* Nested Properties for Object Type */}
            {watchFields[index].type === 'object' && (
              <Grid item xs={12}>
                <Typography variant="subtitle1">Nested Properties</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => addNestedProperty(index)}
                  startIcon={<AddIcon />}
                  sx={{ marginBottom: 1 }}
                >
                  Add Nested Property
                </Button>
                {watchFields[index].properties &&
                  watchFields[index].properties.map((nestedProp, nestedIndex) => (
                    <Box key={nestedIndex} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                      <TextField
                        label={`Nested Property ${nestedIndex + 1}`}
                        {...register(`properties.${index}.properties.${nestedIndex}.name`, { required: true })}
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
                      <IconButton color="error" onClick={() => removeNestedProperty(index, nestedIndex)}>
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}
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
                    <Typography variant="subtitle1">Nested Properties in Array Items</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => addArrayNestedProperty(index)}
                      startIcon={<AddIcon />}
                      sx={{ marginBottom: 1 }}
                    >
                      Add Nested Property
                    </Button>
                    {watchFields[index].itemsProperties &&
                      watchFields[index].itemsProperties.map((nestedProp, nestedIndex) => (
                        <Box key={nestedIndex} sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                          <TextField
                            label={`Nested Property ${nestedIndex + 1}`}
                            {...register(`properties.${index}.itemsProperties.${nestedIndex}.name`, { required: true })}
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
                          <IconButton color="error" onClick={() => removeArrayNestedProperty(index, nestedIndex)}>
                            <RemoveIcon />
                          </IconButton>
                        </Box>
                      ))}
                  </>
                )}
              </Grid>
            )}
          </Grid>
        </Box>
      ))}
    </Paper>
  );
};

export default SchemaBuilder;
