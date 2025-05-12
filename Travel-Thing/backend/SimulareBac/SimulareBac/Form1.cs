using SimulareBac.dbSimulareDataSetTableAdapters;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace SimulareBac
{
    public partial class Form1 : Form
    {
        private TableAdapterManager tableAdapterManager; // Declare the TableAdapterManager instance

        public Form1()
        {
            InitializeComponent();

            // Initialize the TableAdapterManager and set its properties
            this.tableAdapterManager = new TableAdapterManager
            {
                StudentiTableAdapter = this.studentiTableAdapter,
                ContracteTableAdapter = this.contracteTableAdapter
            };
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // TODO: This line of code loads data into the 'dbSimulareDataSet.Studenti' table. You can move, or remove it, as needed.
            this.studentiTableAdapter.Fill(this.dbSimulareDataSet.Studenti);
            // TODO: This line of code loads data into the 'dbSimulareDataSet.Contracte' table. You can move, or remove it, as needed.
            this.contracteTableAdapter.Fill(this.dbSimulareDataSet.Contracte);
        }

        private void dataGridView2_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void button1_Click(object sender, EventArgs e)
        {
            this.Validate();
            this.studentiBindingSource.EndEdit();
            this.tableAdapterManager.UpdateAll(this.dbSimulareDataSet);
        }
    }
}
