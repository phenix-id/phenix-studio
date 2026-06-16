import { Field, FormikProps } from 'formik'
import React, { JSX } from 'react'

import { IFormData } from '../type/schemas-interface'

interface SchemaVersionProps {
  readonly formikHandlers: FormikProps<IFormData>
  readonly required?: boolean
}

function SchemaVersion({
  formikHandlers,
  required = true,
}: SchemaVersionProps): JSX.Element {
  return (
    <div
      className="flex-col sm:w-full md:flex md:w-96"
      style={{ marginLeft: 0 }}
    >
      <div>
        <label
          htmlFor="schemaVersion"
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Schema Version
          {required && <span className="text-destructive">*</span>}
        </label>
      </div>

      <div className="flex-col md:flex">
        <div className="relative">
          <span
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm select-none"
          >
            v
          </span>
          <Field
            id="schemaVersion"
            name="schemaVersion"
            placeholder="1.0 or 1.1"
            className="border-input placeholder:text-muted-foreground/50 focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent py-1 pr-3 pl-6 text-base shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>
        {formikHandlers.touched.schemaVersion &&
        formikHandlers.errors.schemaVersion ? (
          <label
            htmlFor="schemaVersion"
            className="text-destructive h-5 text-xs"
          >
            {formikHandlers.errors.schemaVersion}
          </label>
        ) : (
          <span aria-hidden="true" className="text-destructive h-5 text-xs">
            &nbsp;
          </span>
        )}
      </div>
    </div>
  )
}

export default SchemaVersion
