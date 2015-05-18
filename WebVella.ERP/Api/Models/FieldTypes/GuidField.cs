﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace WebVella.ERP.Api.Models
{
    public class GuidField : Field
    {
        [JsonProperty(PropertyName = "fieldType")]
        public static FieldType FieldType { get { return FieldType.GuidField; } }

        [JsonProperty(PropertyName = "defaultValue")]
        public Guid? DefaultValue { get; set; }

        [JsonProperty(PropertyName = "generateNewId")]
        public bool? GenerateNewId { get; set; }

        public GuidField()
        {
        }

        public GuidField(Field field) : base(field)
        {
        }
    }

    public class GuidFieldMeta : GuidField
    {
        [JsonProperty(PropertyName = "relationFields")]
        public List<Field> RelationFields { get; set; }


        [JsonProperty(PropertyName = "relation")]
        public EntityRelation Relation { get; set; }

        public GuidFieldMeta( GuidField field  ) : base(field)
        {
			DefaultValue = field.DefaultValue;
            GenerateNewId = field.GenerateNewId;
            Relation = null;
            RelationFields = new List<Field>();
        }
	}
}